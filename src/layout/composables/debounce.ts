export const useDebounce = () => {
    let timeout: NodeJS.Timeout | null = null;
    return function (fn: Function, delayMs: number = 500) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            fn();
        }, delayMs);
    }
}