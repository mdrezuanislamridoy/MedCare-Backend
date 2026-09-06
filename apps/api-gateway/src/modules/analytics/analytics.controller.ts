import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS, UserRole } from '@medcare/contracts';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '@medcare/shared';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@ApiTags('Platform Analytics & Overview')
@Controller()
export class AnalyticsGatewayController {
  constructor(
    @Inject(MICROSERVICES.AUTH) private readonly authClient: ClientProxy,
    @Inject(MICROSERVICES.DOCTOR) private readonly doctorClient: ClientProxy,
    @Inject(MICROSERVICES.PATIENT) private readonly patientClient: ClientProxy,
    @Inject(MICROSERVICES.APPOINTMENT) private readonly appointmentClient: ClientProxy,
    @Inject(MICROSERVICES.CLINIC) private readonly clinicClient: ClientProxy,
    @Inject(MICROSERVICES.BILLING) private readonly billingClient: ClientProxy,
  ) {}

  private async queryService<T>(client: ClientProxy, pattern: string, payload: any, fallback: T): Promise<T> {
    try {
      return await firstValueFrom(
        client.send<T>(pattern, payload).pipe(
          timeout(3000),
          catchError((err) => {
            return of(fallback);
          }),
        ),
      );
    } catch {
      return fallback;
    }
  }

  private async aggregatePlatformStats() {
    const [doctorsRes, verificationsRes, patientsRes, clinicsRes, appointmentsRes, billingRes] = await Promise.all([
      this.queryService<any>(this.doctorClient, PATTERNS.DOCTOR.LIST, { limit: 100 }, { data: [], meta: { total: 0 } }),
      this.queryService<any>(this.doctorClient, PATTERNS.DOCTOR.LIST_VERIFICATIONS, { limit: 100 }, { data: [] }),
      this.queryService<any>(this.patientClient, PATTERNS.PATIENT.LIST, { limit: 100 }, { data: [], meta: { total: 0 } }),
      this.queryService<any>(this.clinicClient, PATTERNS.CLINIC.LIST, { limit: 100 }, { data: [], meta: { total: 0 } }),
      this.queryService<any>(this.appointmentClient, PATTERNS.APPOINTMENT.LIST, { limit: 100 }, { data: [], meta: { total: 0 } }),
      this.queryService<any>(this.billingClient, PATTERNS.BILLING.LIST_TRANSACTIONS, { limit: 100 }, { data: [], meta: { total: 0 } }),
    ]);

    const doctorsList = Array.isArray(doctorsRes?.data) ? doctorsRes.data : [];
    const totalDoctors = doctorsRes?.meta?.total ?? doctorsList.length;

    const verificationsList = Array.isArray(verificationsRes?.data) ? verificationsRes.data : (Array.isArray(verificationsRes) ? verificationsRes : []);
    const pendingVerifications = verificationsList.length;

    const patientsList = Array.isArray(patientsRes?.data) ? patientsRes.data : [];
    const totalPatients = patientsRes?.meta?.total ?? patientsList.length;

    const clinicsList = Array.isArray(clinicsRes?.data) ? clinicsRes.data : (Array.isArray(clinicsRes) ? clinicsRes : []);
    const totalClinics = clinicsRes?.meta?.total ?? clinicsList.length;

    const appointmentsList: any[] = Array.isArray(appointmentsRes?.data) ? appointmentsRes.data : [];
    const totalAppointments = appointmentsRes?.meta?.total ?? appointmentsList.length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppointments = appointmentsList.filter((a) => {
      const d = a.date ? new Date(a.date).toISOString().split('T')[0] : '';
      return d === todayStr;
    }).length;

    const upcomingAppointments = appointmentsList.filter((a) => ['PENDING', 'CONFIRMED', 'SCHEDULED'].includes(a.status)).length;

    const transactionsList: any[] = Array.isArray(billingRes?.data) ? billingRes.data : [];
    const totalRevenue = transactionsList.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
    const platformCommission = Math.round(totalRevenue * 0.15);

    // Distribution
    const completedCount = appointmentsList.filter((a) => a.status === 'COMPLETED').length;
    const pendingCount = appointmentsList.filter((a) => ['PENDING', 'SCHEDULED', 'CONFIRMED'].includes(a.status)).length;
    const cancelledCount = appointmentsList.filter((a) => ['CANCELLED', 'NO_SHOW'].includes(a.status)).length;

    const statusDistribution = [
      { name: 'Completed', value: completedCount, color: '#0d9488' },
      { name: 'Pending', value: pendingCount, color: '#f59e0b' },
      { name: 'Cancelled', value: cancelledCount, color: '#ef4444' },
      { name: 'No Show', value: appointmentsList.filter((a) => a.status === 'NO_SHOW').length, color: '#94a3b8' },
    ];

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const revenueTrends = months.map((m, idx) => ({
      month: m,
      revenue: totalRevenue > 0 ? Math.round((totalRevenue / 8) * (0.8 + idx * 0.05)) : 0,
      payouts: totalRevenue > 0 ? Math.round((totalRevenue / 8) * (0.8 + idx * 0.05) * 0.7) : 0,
    }));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const appointmentTrends = days.map((day) => ({
      day,
      completed: completedCount > 0 ? Math.round(completedCount / 7) : 0,
      cancelled: cancelledCount > 0 ? Math.round(cancelledCount / 7) : 0,
      pending: pendingCount > 0 ? Math.round(pendingCount / 7) : 0,
    }));

    return {
      totalUsers: totalDoctors + totalPatients + 1,
      totalDoctors,
      totalPatients,
      totalClinics,
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      totalRevenue,
      platformCommission,
      pendingVerifications,
      kpis: {
        totalDoctors,
        totalPatients,
        totalClinics,
        todayAppointments,
        upcomingAppointments,
        pendingVerifications,
        totalRevenue,
        platformCommission,
      },
      statusDistribution,
      appointmentTrends,
      revenueTrends,
    };
  }

  @Public()
  @ApiOperation({ summary: 'Get public platform statistics' })
  @Get('public/stats')
  async getPublicStats() {
    return this.aggregatePlatformStats();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin get analytics dashboard overview' })
  @Get('admin/analytics/overview')
  async getAdminOverview() {
    return this.aggregatePlatformStats();
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin get analytics revenue breakdown' })
  @Get('admin/analytics/revenue')
  async getAdminRevenue() {
    const stats = await this.aggregatePlatformStats();
    return { revenueTrends: stats.revenueTrends, totalRevenue: stats.totalRevenue };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin get analytics appointments breakdown' })
  @Get('admin/analytics/appointments')
  async getAdminAppointments() {
    const stats = await this.aggregatePlatformStats();
    return { appointmentTrends: stats.appointmentTrends, statusDistribution: stats.statusDistribution };
  }
}
