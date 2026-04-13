export type Role = 'teacher' | 'zavuch' | 'secretary' | 'director';
export type DocStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'completed';

export const ROLE_LABELS: Record<Role, string> = {
    teacher: 'Учитель',
    zavuch: 'Завуч',
    secretary: 'Секретарь',
    director: 'Директор',
};

export const STATUS_COLORS: Record<DocStatus, string> = {
    draft: 'bg-gray-200 text-gray-700',
    review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
};

export const STATUS_LABELS: Record<DocStatus, string> = {
    draft: 'Черновик',
    review: 'На согласовании',
    approved: 'Утверждён',
    rejected: 'Отклонён',
    completed: 'Завершён',
};