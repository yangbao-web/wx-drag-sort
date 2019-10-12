// components/drag-sort-anim/drag-sort-anim.js
const systemInfo = wx.getSystemInfoSync()
let rpx2px = function (rpx) {
  return systemInfo.windowWidth / 750 * rpx
}
const IMAGE_SIZE = rpx2px(210) // 图片尺寸
const COLS = 3 // 图片列数
const MARGIN_IMAGE = rpx2px(30) // 图片间距
const MARGIN_CONTAINER = rpx2px(30) // 容器间距
const MAX_COUNT = 5 // 图片最大数量

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    data: {
      type: Array,
      value: [],
      observer(val) {
        if (val && val.length > 0) {
          this.initPosition()
        }
      }
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    imageList: [],
    draging: false,
  },
  lifetimes: {
    attached: function () {
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    initPosition () {
      let data = [...this.data.data]
      if (data.length < MAX_COUNT) {
        data.push({
          type: 'upload'
        })
      }
      this.setData({
        imageList: data.map((item, index) => {
          let top = MARGIN_CONTAINER + Math.floor(index / COLS) * (IMAGE_SIZE + MARGIN_IMAGE)
          let left = MARGIN_CONTAINER + Math.floor(index % COLS) * (IMAGE_SIZE + MARGIN_IMAGE)
          let imageItem = {
            index: index,
            boxTop: top,
            boxLeft: left,
            top,
            left,
          }
          if (Object.prototype.toString.call(item) === '[object Object]') {
            imageItem.type = item.type
          } else {
            imageItem.url = item
          }
          return imageItem
        })
      })
    },
    handleTouchstart(e) {
      let changedTouch = e.changedTouches[0]
      let {index} = e.currentTarget.dataset
      this.setData({
        startIndex: index, // 滑动的图片索引
      })
      this.setData({
        draging: true
      })
      // 起始位置信息
      this.startClient = {
        startX: changedTouch.clientX,
        startY: changedTouch.clientY,
        startTop: this.data.imageList[index].top,
        startLeft: this.data.imageList[index].left,
      }
    },
    handleTouchend() {
      if (!this.data.draging) {
        return
      }
      let imageList = this.data.imageList
      let activedImage = imageList[this.data.startIndex]
      imageList[this.data.startIndex] = {
        ...activedImage,
        top: activedImage.boxTop,
        left: activedImage.boxLeft,
      }
      this.setData({
        startIndex: null,
        imageList
      })
      let validImageList = this.data.imageList.filter((item) => {
        return item.type !== 'upload'
      })
      validImageList.sort((pre, next) => {
        return pre.index - next.index
      })
      let imageSortedList = validImageList.map((item) => {
        return item.url
      })
      setTimeout(() => {
        this.setData({
          draging: false,
        })
        this.triggerEvent('change', {
          imageSortedList
        })
      }, 200)
    },
    handleTouchMove(e) {
      if (!this.data.draging) {
        return
      }
      let changedTouch = e.changedTouches[0]
      // 滑动距离
      let moveX = changedTouch.clientX - this.startClient.startX
      let moveY = changedTouch.clientY - this.startClient.startY
      let imageList = this.data.imageList
      imageList.forEach((item, index) => {
        if (index === this.data.startIndex) {
          item.top = this.startClient.startTop + moveY
          item.left = this.startClient.startLeft + moveX
        }
      })
      this.setData({
        imageList
      })
      let direction = null
      for (let i = 0; i < imageList.length; i++) {
        if (this.data.startIndex !== i &&
          imageList[i].type !== 'upload' &&
          changedTouch.clientX > imageList[i].left &&
          changedTouch.clientY > imageList[i].top &&
          changedTouch.clientX < imageList[i].left + IMAGE_SIZE &&
          changedTouch.clientY < imageList[i].top + IMAGE_SIZE) {
          if (imageList[this.data.startIndex].boxTop > imageList[i].top) {
            direction = 'up'
          } else if (imageList[this.data.startIndex].boxTop < imageList[i].top) {
            direction = 'down'
          } else {
            direction = 'normal'
          }
          this.swap(direction, i)
        }
      }
    },
    // 交换
    swap(direction, index) {
      let imageList = this.data.imageList
      if (direction === 'normal') {
        let endImage = imageList[index]
        let activedImage = imageList[this.data.startIndex]
        imageList[index] = {
          ...imageList[index],
          index: activedImage.index,
          top: activedImage.boxTop,
          left: activedImage.boxLeft,
          boxTop: activedImage.boxTop,
          boxLeft: activedImage.boxLeft,
        }
        imageList[this.data.startIndex] = {
          ...imageList[this.data.startIndex],
          index: endImage.index,
          boxTop: endImage.boxTop,
          boxLeft: endImage.boxLeft,
        }
      } else if (direction === 'up') {
        let startIndex = imageList[index].index
        let endIndex = imageList[this.data.startIndex].index
        let imageListCache = [...imageList]
        for (let i = startIndex; i < endIndex; i++) {
          let nextImage = imageListCache.find((item) => {
            return item.index === i + 1
          })
          let currentIndex = imageListCache.findIndex((item) => {
            return item.index === i
          })
          imageList[currentIndex] = {
            ...imageList[currentIndex],
            index: nextImage.index,
            top: nextImage.boxTop,
            left: nextImage.boxLeft,
            boxTop: nextImage.boxTop,
            boxLeft: nextImage.boxLeft,
          }
        }
        let startImage = imageListCache.find((item) => {
          return item.index === startIndex
        })
        imageList[this.data.startIndex] = {
          ...imageList[this.data.startIndex],
          index: startImage.index,
          boxTop: startImage.boxTop,
          boxLeft: startImage.boxLeft,
        }
      } else if (direction === 'down') {
        let startIndex = imageList[this.data.startIndex].index
        let endIndex = imageList[index].index
        let imageListCache = [...imageList]
        for (let i = endIndex; i > startIndex; i--) {
          let preImage = imageListCache.find((item) => {
            return item.index === i - 1
          })
          let currentIndex = imageListCache.findIndex((item) => {
            return item.index === i
          })
          imageList[currentIndex] = {
            ...imageList[currentIndex],
            index: preImage.index,
            top: preImage.boxTop,
            left: preImage.boxLeft,
            boxTop: preImage.boxTop,
            boxLeft: preImage.boxLeft,
          }
        }
        let endImage = imageListCache.find((item) => {
          return item.index === endIndex
        })
        imageList[this.data.startIndex] = {
          ...imageList[this.data.startIndex],
          index: endImage.index,
          boxTop: endImage.boxTop,
          boxLeft: endImage.boxLeft,
        }
      }
      this.setData({
        imageList
      })
    },
    // 删除
    handleDelete(e) {
      let imageList = this.data.imageList
      let startIndex = e.currentTarget.dataset.index
      let endIndex = imageList.length
      let imageListCache = [...imageList]
      for (let i = endIndex; i > startIndex; i--) {
        let preImage = imageListCache.find((item) => {
          return item.index === i - 1
        })
        let currentIndex = imageListCache.findIndex((item) => {
          return item.index === i
        })
        imageList[currentIndex] = {
          ...imageList[currentIndex],
          index: preImage.index,
          top: preImage.boxTop,
          left: preImage.boxLeft,
          boxTop: preImage.boxTop,
          boxLeft: preImage.boxLeft,
        }
      }
      imageList[startIndex] = {
        ...imageList[startIndex],
        deleted: true,
      }
      this.setData({
        draging: true,
        imageList,
      })
      setTimeout(() => {
        this.data.imageList.splice(startIndex, 1)
        let validImageList = this.data.imageList.filter((item) => {
          return item.type !== 'upload'
        })
        this.setData({
          draging: false,
        })
        this.triggerEvent('change', {
          imageSortedList: validImageList.map((item) => {
            return item.url
          })
        })
      }, 200)
    }
  }
})
