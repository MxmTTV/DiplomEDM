import toast from 'react-hot-toast';

export const notify = {
    success: (message: string) => {
        toast.success(message, {
            duration: 3000,
            style: {
                background: '#52c41a',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#52c41a',
            },
        });
    },

    error: (message: string) => {
        toast.error(message, {
            duration: 4000,
            style: {
                background: '#f5222d',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#f5222d',
            },
        });
    },

    warning: (message: string) => {
        toast(message, {
            duration: 3000,
            style: {
                background: '#fa8c16',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            },
            icon: '⚠️',
        });
    },

    loading: (message: string) => {
        return toast.loading(message, {
            style: {
                background: '#1890ff',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px 24px',
            },
        });
    },
};