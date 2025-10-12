

export interface GetAllUsersQueryDto{
    role: string;
    gender?: string;
    search?: string;
    page?:string;
    limit?:string;
}

export interface DashboardResponseDto{
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