import { useState, useCallback } from 'react';

/**
 * Generic hook for API calls with loading/error state.
 *
 * Usage:
 *   const { data, loading, error, execute } = useApi(bookingService.getMyBookings);
 *   useEffect(() => { execute({ page: 1 }); }, [execute]);
 */
const useApi = (apiFunction) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const execute = useCallback(
        async (...args) => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiFunction(...args);
                setData(response.data);
                return response.data;
            } catch (err) {
                const message = err.response?.data?.message || err.message || 'Something went wrong';
                setError(message);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [apiFunction]
    );

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
    }, []);

    return { data, loading, error, execute, reset };
};

export default useApi;
