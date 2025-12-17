import { CreateCompetitionDto } from "../dto/create-competition.dto";
import { UpdateCompetitionDto } from "../dto/update-competition.dto";
import { Competition } from "../models/competition.schema";

export const ICompetitionServiceToken = Symbol('ICompetitionService');

export interface ICompetitionService {
    // Core Business Logic
    create(createCompetitionDto: CreateCompetitionDto, organizerId: string, posterFile?: any, documentFile?: any): Promise<Competition>;
    update(id: string, updateCompetitionDto: UpdateCompetitionDto, posterFile?: any, documentFile?: any): Promise<Competition>;
    remove(id: string): Promise<void>;

    // Retrieval with Logic (e.g., signing URLs)
    findOne(id: string): Promise<Competition>;
    findAll(options?: {
        search?: string;
        sortBy?: string;
        level?: string;
        style?: string;
        category?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: Competition[], total: number, page: number, totalPages: number }>;

    findByOrganizer(organizerId: string, options?: {
        search?: string;
        sortBy?: string;
        level?: string;
        style?: string;
        category?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: Competition[], total: number, page: number, totalPages: number }>;
    findActiveCompetitions(): Promise<Competition[]>;
    findByCategory(category: string): Promise<Competition[]>;
    findByStyle(style: string): Promise<Competition[]>;
    findRegisteredCompetitions(dancerId: string, options?: {
        search?: string;
        sortBy?: string;
        level?: string;
        style?: string;
        category?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: Competition[], total: number, page: number, totalPages: number }>;

    // Specialized Logic
    registerDancer(competitionId: string, dancerId: string, paymentStatus?: string): Promise<Competition>;
    updatePaymentStatus(competitionId: string, dancerId: string, paymentStatus: string): Promise<Competition>;
    updateScore(competitionId: string, dancerId: string, score: number): Promise<Competition>;
    finalizeResults(competitionId: string, results: any): Promise<Competition>;

    // Payment Logic
    initiatePayment(competitionId: string, dancerId: string, amount: number, currency: string): Promise<any>;
    confirmPayment(competitionId: string, dancerId: string, paymentId: string, orderId: string, signature: string, amount: number): Promise<any>;
    markPaymentFailed(competitionId: string, userId: string): Promise<void>;
}
