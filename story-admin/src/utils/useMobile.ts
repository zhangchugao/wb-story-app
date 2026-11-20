import { ref, onMounted, onUnmounted } from 'vue'

// 响应式断点检测：默认 768px 以下视为移动端
export function useMobile(breakpoint = 768) {
  const isMobile = ref(false)
  let mql: MediaQueryList | null = null

  const update = (e: MediaQueryListEvent | MediaQueryList) => {
    isMobile.value = e.matches
  }

  onMounted(() => {
    mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    update(mql)
    mql.addEventListener('change', update)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', update)
  })

  return { isMobile }
}
