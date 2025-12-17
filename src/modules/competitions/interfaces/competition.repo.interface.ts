import { Competition } from "../models/competition.schema";

export const ICompetitionRepoToken = Symbol('ICompetitionRepo')

export interface ICompetitionRepo {
    // Basic CRUD
    create(data: Partial<Competition>): Promise<Competition>;
    update(id: string, data: Partial<Competition>): Promise<Competition | null>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<Competition | null>;
    findAll(): Promise<Competition[]>;
    find(query: any, sort?: any, skip?: number, limit?: number): Promise<{ data: Competition[], total: number }>;

    // Custom Queries
    findByIdPublic(id: string): Promise<Competition | null>;
    findByOrganizer(organizerId: string, query?: any, sort?: any, skip?: number, limit?: number): Promise<{ data: Competition[], total: number }>;
    findActiveCompetitions(): Promise<Competition[]>;
    findByCategory(category: string): Promise<Competition[]>;
    findByStyle(style: string): Promise<Competition[]>;
    findRegisteredCompetitions(dancerId: string, query?: any, sort?: any, skip?: number, limit?: number): Promise<{ data: Competition[], total: number }>;
}