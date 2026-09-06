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
    // This service is bypassed — the API Gateway aggregates live data directly.
    // Return empty structure; real data comes from aggregatePlatformStats() in the gateway.
    return {
      kpis: {
        totalDoctors: 0,
        totalPatients: 0,
        totalClinics: 0,
        todayAppointments: 0,
        upcomingAppointments: 0,
        pendingVerifications: 0,
        flaggedReviews: 0,
        totalRevenue: 0,
      },
      appointmentTrends: [],
      revenueTrends: [],
      newUsersData: [],
    };
  }
}
