export const bannersKeys = {
  all: ['banners'] as const,
  list: () => [...bannersKeys.all, 'list'] as const,
  detail: (id: string) => [...bannersKeys.all, 'detail', id] as const,
}
