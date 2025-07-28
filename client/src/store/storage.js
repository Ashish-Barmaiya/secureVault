const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem() {
      return Promise.resolve();
    },
    removeItem() {
      return Promise.resolve();
    },
  };
};

let storage;

if (typeof window !== "undefined") {
  // Use localStorage directly with proper error handling
  storage = {
    getItem: (key) => {
      return new Promise((resolve, reject) => {
        try {
          const item = window.localStorage.getItem(key);
          resolve(item);
        } catch (error) {
          reject(error);
        }
      });
    },
    setItem: (key, value) => {
      return new Promise((resolve, reject) => {
        try {
          window.localStorage.setItem(key, value);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
    removeItem: (key) => {
      return new Promise((resolve, reject) => {
        try {
          window.localStorage.removeItem(key);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    },
  };
} else {
  storage = createNoopStorage();
}

export default storage;
