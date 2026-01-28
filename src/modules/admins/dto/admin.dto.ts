export interface GetAllUsersQueryDto {
  role: string;
  gender?: string;
  search?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardResponseDto {
  totalUsers: number;
  totalDancers: number;
  totalInstructors: number;
  totalOrganizers: number;
  totalClients: number;
  totalWorkshops: number;
  totalCompetitions: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  // topDancers: TopDancersDto[];
}

export interface DashboardStats {
    totals: {
        users: {
            total: number;
            byRole: {
                dancer: number;
                instructor: number;
                organizer: number;
                client: number;
            };
        };
        workshops: number;
        competitions: number;
        revenue: number;
        pendingApprovals: number;
    };
    active: {
        today: number;
        thisWeek: number;
    };
}

export interface PaymentResponse {
    _id: string;
    referenceId: string;
    orderId: string;
    createdAt: Date;
    user?: {
        _id: string;
        username?: string;
        email?: string;
        role?: string;
    };
    paymentType: string;
    relatedEntityName: string;
    relatedEntityId: string;
    amount: number;
    status: string;
    failureReason?: string;
    refundStatus?: string;
    refundAmount?: number;
    payoutStatus?: string;
    payoutDate?: string;
    beneficiary?: string;
    settlementReferenceId?: string;
}
