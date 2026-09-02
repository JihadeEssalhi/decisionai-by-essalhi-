export type UserRole = 'ADMIN' | 'ANALYST' | 'USER';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    created_at: string;
    last_login: string;
}

export function getDashboardRoute(role: UserRole): string {
    switch (role) {
        case 'ADMIN':
            return '/dashboard/admin';
        case 'ANALYST':
            return '/dashboard/analyst';
        case 'USER':
            return '/dashboard/user';
        default:
            return '/dashboard/user';
    }
}

// Fonction pour vérifier si une route est un dashboard
export function isDashboardRoute(path: string): boolean {
    return path.startsWith('/dashboard');
}