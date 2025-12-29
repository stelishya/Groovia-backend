
import { Injectable } from "@nestjs/common";
import { Admin, AdminDocument } from "../models/admins.schema";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { UserDocument, User } from '../../users/models/user.schema';
import { WorkshopDocument, Workshop } from '../../workshops/models/workshop.schema';
    import { CompetitionDocument, Competition } from '../../competitions/models/competition.schema';
    import { PaymentDocument, Payment } from '../../payments/models/payment.schema';
    import { UpgradeRequest, upgradeRequestSchema } from '../../users/models/upgrade-request.schema';
    // import { Model } from 'mongoose';
    
    @Injectable()
    export class AdminRepository {
        constructor(
            @InjectModel(Admin.name) 
            private readonly _adminModel: Model<AdminDocument>,
            @InjectModel(Payment.name) 
            private readonly paymentModel: Model<Payment>,
            @InjectModel(User.name)
            private readonly _userModel: Model<UserDocument>,
            @InjectModel(Workshop.name)
            private readonly _workshopModel: Model<WorkshopDocument>,
            @InjectModel(Competition.name)
            private readonly _competitionModel: Model<CompetitionDocument>,
            @InjectModel(Payment.name)
            private readonly _paymentModel: Model<PaymentDocument>,
            @InjectModel(UpgradeRequest.name)
            private readonly _upgradeRequestModel: Model<any>,
        ) { }
        
        async findOne(filter: FilterQuery<Admin>): Promise<Admin | null> {
            return this._adminModel.findOne(filter).exec();
        }
        
        async create(input: Partial<Admin>): Promise<Admin> {
            return this._adminModel.create(input);
        }
        
        async getDashboardAggregates(): Promise<any> {
            const roles = ['dancer', 'instructor', 'organizer', 'client'];
            const totalUsersByRolePromises = roles.map(role =>
                this._userModel.countDocuments({ role: role }).exec()
            );
            const totalsByRole = await Promise.all(totalUsersByRolePromises);
            
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const activeToday = await this._userModel.countDocuments({ updatedAt: { $gte: oneDayAgo } }).exec();
        const activeThisWeek = await this._userModel.countDocuments({ updatedAt: { $gte: sevenDaysAgo } }).exec();

        const totalWorkshops = await this._workshopModel.countDocuments({}).exec();
        const totalCompetitions = await this._competitionModel.countDocuments({}).exec();

        const revenueAgg = await this._paymentModel.aggregate([
            { $match: { status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ] as any).exec();
        const totalRevenue = (revenueAgg[0] && revenueAgg[0].total) || 0;
        
        const pendingApprovals = await this._upgradeRequestModel.countDocuments({ status: 'pending' }).exec();
        
        return {
            totals: {
                users: {
                    total: await this._userModel.countDocuments({}).exec(),
                    byRole: {
                        dancer: totalsByRole[0],
                        instructor: totalsByRole[1],
                        organizer: totalsByRole[2],
                        client: totalsByRole[3],
                    }
                },
                workshops: totalWorkshops,
                competitions: totalCompetitions,
                revenue: totalRevenue,
                pendingApprovals,
            },
            active: {
                today: activeToday,
                thisWeek: activeThisWeek,
            }
        };
    }
    
    async getUserGrowth(startDate?: string, endDate?: string, interval: string = 'daily') {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const dateFormat = interval === 'monthly' ? '%Y-%m' : '%Y-%m-%d';

        const pipeline = [
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const result = await (this._userModel.aggregate(pipeline as any) as any).exec();
        return result.map((r: any) => ({ label: r._id, value: r.count }));
    }

    async getRevenueTrend(startDate?: string, endDate?: string, interval: string = 'daily') {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const dateFormat = interval === 'monthly' ? '%Y-%m' : '%Y-%m-%d';

        const pipeline = [
            { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const result = await (this._paymentModel.aggregate(pipeline as any) as any).exec();
        return result.map((r: any) => ({ label: r._id, value: r.total }));
    }
    async getPayments(query: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        status?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{ payments: any[]; total: number }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status,
            type,
            dateFrom,
            dateTo,
        } = query;

        const filter: any = {};
        if (status) filter.status = status;
        if (type) filter.type = type;
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }

        const total = await this.paymentModel.countDocuments(filter);
        const paymentsRaw = await this.paymentModel
            .find(filter)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({ path: 'userId', select: 'username email role' })
            .exec();

        // Map related entity name/type
        const payments = await Promise.all(paymentsRaw.map(async (p: any) => {
            let relatedEntityName = '';
            let relatedEntityId = '';
            if (p.paymentType === 'workshop' && p.metadata?.workshopId) {
                const workshop = await this._workshopModel.findById(p.metadata.workshopId).select('title').lean();
                relatedEntityName = workshop?.title || '';
                relatedEntityId = p.metadata.workshopId;
            } else if (p.paymentType === 'competition' && p.metadata?.competitionId) {
                const competition = await this._competitionModel.findById(p.metadata.competitionId).select('title').lean();
                relatedEntityName = competition?.title || '';
                relatedEntityId = p.metadata.competitionId;
            } else if (p.paymentType === 'role_upgrade') {
                relatedEntityName = 'Role Upgrade';
                relatedEntityId = p.metadata?.upgradeRequestId || '';
            } else if (p.paymentType === 'event_booking') {
                relatedEntityName = 'Event';
                relatedEntityId = p.metadata?.eventId || '';
            }

            // Use timestamps from mongoose
            let createdAt = p.createdAt;
            if (!createdAt && p._doc && p._doc.createdAt) createdAt = p._doc.createdAt;

            // User population may be ObjectId or populated object
            let user = null;
            // if (p.userId && typeof p.userId === 'object' && p.userId.username) {
            //     user = {
            //         _id: p.userId._id,
            //         username: p.userId.username,
            //         email: p.userId.email,
            //         role: p.userId.role,
            //     };
            // }

            return {
                _id: p._id,
                referenceId: p.referenceId,
                orderId: p.orderId,
                createdAt,
                user,
                paymentType: p.paymentType,
                relatedEntityName,
                relatedEntityId,
                amount: p.amount,
                status: p.status,
                failureReason: p.metadata?.failureReason || '',
                refundStatus: p.metadata?.refundStatus || '',
                refundAmount: p.metadata?.refundAmount || 0,
                payoutStatus: p.metadata?.payoutStatus || '',
                payoutDate: p.metadata?.payoutDate || '',
                beneficiary: p.metadata?.beneficiary || '',
                settlementReferenceId: p.metadata?.settlementReferenceId || '',
            };
        }));

        return { payments, total };
    }
}