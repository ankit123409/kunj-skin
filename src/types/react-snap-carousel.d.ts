declare module 'react-snap-carousel' {
  export interface SnapCarouselGoToOptions {
    behavior?: ScrollBehavior
  }

  export interface SnapCarouselResult {
    readonly scrollRef: React.RefObject<HTMLDivElement>
    readonly pages: number[]
    readonly activePageIndex: number
    readonly hasPrevPage: boolean
    readonly hasNextPage: boolean
    readonly prev: (opts?: SnapCarouselGoToOptions) => void
    readonly next: (opts?: SnapCarouselGoToOptions) => void
    readonly goTo: (pageIndex: number, opts?: SnapCarouselGoToOptions) => void
    readonly snapPointIndexes: Set<number>
  }

  export interface SnapCarouselOptions {
    readonly axis?: 'x' | 'y'
    readonly initialPages?: number
  }

  export const useSnapCarousel: ({ axis, initialPages }?: SnapCarouselOptions) => SnapCarouselResult
}
