import api from './api';

const API_URL = "/v2/sidebar";

export const getSidebarOptions = async () => {
    const response = await api.get(API_URL);
    return response.data;
}