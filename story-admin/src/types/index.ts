export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export interface PageData<T> {
  total: number
  page: number
  pageSize: number
  list: T[]
}

export interface AdminUser {
  id: number
  username: string
}

export interface Category {
  id: number
  name: string
  icon: string
  sort_order: number
}

export interface Episode {
  id: number
  story_id: number
  title: string
  episode_no: number
  audio_url: string
  duration: number
}

export interface Story {
  id: number
  title: string
  author: string
  narrator: string
  category_id: number | null
  category_name?: string
  cover_url: string
  description: string
  audio_url: string
  duration: number
  play_count: number
  status: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface HotKeyword {
  id: number
  keyword: string
  weight: number
  sort_order: number
}

export interface UserItem {
  id: number
  openid: string
  nickname: string
  avatar_url: string
  created_at: string
  favorite_count: number
  history_count: number
}

export interface Stats {
  storyCount: number
  onlineCount: number
  userCount: number
  favoriteCount: number
  totalPlays: number
  historyCount: number
  byCategory: { name: string; value: number }[]
  topStories: { id: number; title: string; play_count: number }[]
}

export interface StoryPayload {
  title: string
  author?: string
  narrator?: string
  category_id?: number | null
  cover_url?: string
  description?: string
  audio_url?: string
  duration?: number
  status?: number
  sort_order?: number
}
