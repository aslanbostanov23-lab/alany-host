const getFullUrl = (endpoint) => {
  let clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!clean.startsWith('/api')) {
    clean = `/api${clean}`;
  }
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}:5000${clean}`;
  }
  return clean;
};

export const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // GET
  get: async (endpoint) => {
    try {
      const url = getFullUrl(endpoint);
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
      return data;
    } catch (error) {
      console.error(`API GET ${endpoint} error:`, error);
      throw error;
    }
  },

  // POST
  post: async (endpoint, body = {}) => {
    try {
      const url = getFullUrl(endpoint);
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
      return data;
    } catch (error) {
      console.error(`API POST ${endpoint} error:`, error);
      throw error;
    }
  },

  // PUT
  put: async (endpoint, body = {}) => {
    try {
      const url = getFullUrl(endpoint);
      const response = await fetch(url, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
      return data;
    } catch (error) {
      console.error(`API PUT ${endpoint} error:`, error);
      throw error;
    }
  },

  // DELETE
  delete: async (endpoint) => {
    try {
      const url = getFullUrl(endpoint);
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Ошибка запроса');
      return data;
    } catch (error) {
      console.error(`API DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};
