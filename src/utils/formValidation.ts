export interface ValidationResult {
    isValid: boolean;
    message?: string;
}

export const validateLoginForm = (email: string, password: string): ValidationResult => {
    if (!email || !password) {
        return {
            isValid: false,
            message: 'Email and password required'
        };
    }
    return { isValid: true };
}; 