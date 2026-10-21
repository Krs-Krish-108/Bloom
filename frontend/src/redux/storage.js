// Custom web storage adapter for redux-persist that is 100% compatible with Vite and ESM
const createNoopStorage = () => {
  return {
    getItem(_key) {
      return Promise.resolve(null);
    },
    setItem(_key, value) {
      return Promise.resolve(value);
    },
    removeItem(_key) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? {
        getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key, item) =>
          Promise.resolve(window.localStorage.setItem(key, item)),
        removeItem: (key) =>
          Promise.resolve(window.localStorage.removeItem(key)),
      }
    : createNoopStorage();

export default storage;
