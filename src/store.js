import { observable, ObservableMap } from 'mobx';

const DEFAULT_DATA = {
  x: 0,
  y: 0
};

export default class {
  @observable id = null;
  @observable hostId = null;
  @observable members = new ObservableMap();

  setId(id) {
    this.id = id;
  }

  setHostId(id) {
    this.hostId = id;
  }

  addMember(id) {
    this.members.set(id, DEFAULT_DATA);
  }

  removeMember(id) {
    this.members.delete(id);
  }

  updateMember(id, data) {
    this.members.set(id, data);
  }
}
