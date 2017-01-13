'use strict'

import dialogsWrapperFactory from './dialogs-wrapper'
import { defaultsDeep } from './util'

class VueModalDialogs {
  constructor () {
    this.Vue = null
    this.debug = process.env.NODE_ENV === 'development'
    this.dialogsWrapper = null
    this.dialogFunctions = {}
    this.inject = true
  }

  install (Vue, options) {
    options = defaultsDeep(options, {
      el: null,
      inject: true
    })

    // export vue instance to global scope
    // so that we can easily modify its prototype
    this.Vue = Vue

    // install `this` into vue
    this.Vue.prototype.$dialogs = this

    // A mount element for the modal dialogs' wrapper
    let el = options.el
    if (typeof el === 'string') {
      el = document.querySelector(el)
    }

    if (el == null) {
      el = document.createElement('div')
      document.body.insertBefore(el, document.body.childNodes[0])
    }

    // determines if shortcut functions will be added
    // into Vue's prototype
    this.inject = options.inject

    // and mount the modal dialogs' wrapper on that anchor
    const DialogsWrapper = dialogsWrapperFactory(Vue, options)
    this.dialogsWrapper = new DialogsWrapper()
    this.dialogsWrapper.$mount(el)
  }

  add (name, component, ...args) {
    name = name.toString().trim()

    // make sure 'name' is unique
    if (this.dialogFunctions.hasOwnProperty(name)) {
      if (this.debug) console.error(`[vue-modal-dialogs] Another modal function ${name} is already exist.`)
      return
    }

    // store dialog options
    if (args.length === 0) {
      this.dialogFunctions[name] = component
    } else {
      this.dialogFunctions[name] = { component, args }
    }

    if (this.inject) {
      this.Vue.prototype[`$${name}`] = this.show.bind(this, name)
    }
  }

  show (name, ...args) {
    return new Promise((resolve, reject) => {
      if (!this.dialogFunctions.hasOwnProperty(name)) {
        if (this.debug) console.error(`[vue-modal-dialogs] Modal dialog ${name} is not found.`)
        return reject(new Error(`Modal dialog ${name} is not found.`))
      }

      resolve(this.dialogsWrapper.add(this.dialogFunctions[name], ...args))
    })
  }
}

export default new VueModalDialogs()
