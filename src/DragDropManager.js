import createStore from 'redux/lib/createStore';
import reducer from './reducers';
import * as dragDropActions from './actions/dragDrop';
import DragDropMonitor from './DragDropMonitor';
import HandlerRegistry from './HandlerRegistry';

export default class DragDropManager {
  constructor(createBackend) {
    const store = createStore(reducer);

    this.store = store;
    this.monitor = new DragDropMonitor(store);
    this.registry = this.monitor.registry;
    this.backend = createBackend(this);

    store.subscribe(this.handleRefCountChange.bind(this));
  }

  handleRefCountChange() {
    const shouldSetUp = this.store.getState().refCount > 0;
    if (shouldSetUp && !this.isSetUp) {
      this.backend.setup();
      this.isSetUp = true;
    } else if (!shouldSetUp && this.isSetUp) {
      this.backend.teardown();
      this.isSetUp = false;
    }
  }

  getMonitor() {
    return this.monitor;
  }

  getBackend() {
    return this.backend;
  }

  getRegistry() {
    return this.registry;
  }

  getActions() {
    const manager = this;
    const { dispatch } = this.store;

    function bindActionCreator(actionCreator) {
      return function () {
        const action = actionCreator.apply(manager, arguments);
        if (typeof action !== 'undefined') {
          dispatch(action);
        }
      }
    }

    return Object.keys(dragDropActions).filter(
      key => typeof dragDropActions[key] === 'function'
    ).reduce((boundActions, key) => {
      boundActions[key] = bindActionCreator(dragDropActions[key]);
      return boundActions;
    }, {});
  }
}