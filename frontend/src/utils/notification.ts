import toast from 'react-hot-toast';

export const notify = {
    // ✅ Успех
    success: (message: string) => {
        toast.success(message, {
            duration: 3000,
            position: 'top-right',
            style: {
                background: '#52c41a',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#52c41a',
            },
        });
    },

    // ❌ Ошибка
    error: (message: string) => {
        toast.error(message, {
            duration: 4000,
            position: 'top-right',
            style: {
                background: '#f5222d',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(245, 34, 45, 0.3)',
            },
            iconTheme: {
                primary: '#fff',
                secondary: '#f5222d',
            },
        });
    },

    // ⚠️ Предупреждение
    warning: (message: string) => {
        toast(message, {
            duration: 3500,
            position: 'top-right',
            style: {
                background: '#fa8c16',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(250, 140, 22, 0.3)',
            },
            icon: '⚠️',
        });
    },

    // ℹ️ Информация
    info: (message: string) => {
        toast(message, {
            duration: 3000,
            position: 'top-right',
            style: {
                background: '#1890ff',
                color: '#fff',
                borderRadius: '12px',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
            },
            icon: 'ℹ️',
        });
    },
};