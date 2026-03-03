import api from './axios'

export const getMyBadges = () => api.get('/badges/my')
export const getAllBadges = () => api.get('/badges')
export const getTeamBadges = () => api.get('/badges/team')
export const awardBadge = (userId, badgeId) => api.post('/badges/award', { userId, badgeId })
