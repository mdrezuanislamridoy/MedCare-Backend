import { Injectable } from '@nestjs/common';

export interface AnalyticsOverviewDto {
  kpis: {
    totalDoctors: number;
    totalPatients: number;
    totalClinics: number;
    todayAppointments: number;
    upcomingAppointments: number;
    pendingVerifications: number;
    flaggedReviews: number;
    totalRevenue: number;
  };
  appointmentTrends: Array<{
    day: string;
    completed: number;
    cancelled: number;
    pending: number;
  }>;
  revenueTrends: Array<{
    month: string;
    revenue: number;
    refunds: number;
  }>;
  newUsersData: Array<{
    week: string;
    patients: number;
    doctors: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  async getOverview(): Promise<AnalyticsOverviewDto> {
    const data: AnalyticsOverviewDto = {
      kpis: {
        totalDoctors: 284,
        totalPatients: 12847,
        totalClinics: 47,
        todayAppointments: 183,
        upcomingAppointments: 412,
        pendingVerifications: 4,
        flaggedReviews: 2,
        totalRevenue: 362400,
      },
      appointmentTrends: [
        { day: 'Mon', completed: 45, cancelled: 8, pending: 32 },
        { day: 'Tue', completed: 52, cancelled: 5, pending: 28 },
        { day: 'Wed', completed: 61, cancelled: 12, pending: 35 },
        { day: 'Thu', completed: 48, cancelled: 7, pending: 41 },
        { day: 'Fri', completed: 73, cancelled: 9, pending: 29 },
        { day: 'Sat', completed: 38, cancelled: 4, pending: 15 },
        { day: 'Sun', completed: 21, cancelled: 3, pending: 9 },
      ],
      revenueTrends: [
        { month: 'Mar', revenue: 48200, refunds: 3200 },
        { month: 'Apr', revenue: 52800, refunds: 2900 },
        { month: 'May', revenue: 61400, refunds: 4100 },
        { month: 'Jun', revenue: 58700, refunds: 3800 },
        { month: 'Jul', revenue: 67300, refunds: 2600 },
        { month: 'Aug', revenue: 71200, refunds: 3400 },
      ],
      newUsersData: [
        { week: 'W1', patients: 124, doctors: 8 },
        { week: 'W2', patients: 98, doctors: 11 },
        { week: 'W3', patients: 143, doctors: 7 },
        { week: 'W4', patients: 167, doctors: 14 },
      ],
    };

    return data;
  }
}
