import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
// import WebMidi from 'webmidi';
// import Tone from 'tone';

import * as PeerSession from './lib/peerSession';
import { pick } from './lib/utils'

// import App from './App';
// import registerServiceWorker from './registerServiceWorker';
import './index.css';

import Store from './store';

const store = new Store();

const MemberListItem = ({ id, data, me, host }) => (
  <li>
    <strong>{id}</strong>
    {host && <span>Host</span>}
    {me && <span>Me</span>}
    <span>{data.x.toPrecision(3)}, {data.y.toPrecision(3)}</span>
  </li>
);

@observer class App extends React.Component {
  render() {
    const { id, hostId, members } = this.props.store;
    const sessionUrl = `${document.location.host}/${hostId}`;
    return (
      <div>
        <div>
          Share this link <a href={sessionUrl}>{sessionUrl}</a>
        </div>
        <ul>
          {members.entries().map(([_id, data]) => (
            <MemberListItem
              key={_id}
              id={_id}
              me={_id === id}
              host={_id === hostId}
              data={data}
            />
          ))}
        </ul>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
          {members.entries().map(([_id, data]) => (
            <div
              key={_id}
              style={{
                backgroundColor: 'blue',
                position: 'absolute',
                left: `${100 * data.x}%`,
                top: `${100 * data.y}%`,
                width: '10px',
                height: '10px',
                borderRadius: '50%'
              }}
            >
            </div>
          ))}
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App store={store} />, document.getElementById('root'));
// registerServiceWorker();

// var synth = new Tone.Synth().toMaster();

function eachConnection(peer, cb) {
  Object.keys(peer.connections).forEach((peerId) => {
    const peerConnections = peer.connections[peerId];
    peerConnections.forEach(cb);
  });
}

function connectToMembers(members, peer) {
  members.forEach((id) => {
    peer.connect(id);
  });
}

function setupConnectionHandlers(connection, peer) {
  connection.on('data', (data) => {
    const { type, payload } = data;
    console.log(data);
    switch(type) {
      case 'event':
        handleRemoteData(payload, connection);
        break;
      case 'connectTo':
        console.log('connectTo', payload);
        connectToMembers(payload, peer);
        break;
      default:
        console.warn('Unhandled remote data', data);
    }
  });

  connection.on('open', () => {
    store.addMember(connection.peer);
  });

  connection.on('close', () => {
    store.removeMember(connection.peer);
  });
}
const windowWidth = 1.0 * window.innerWidth;
const windowHeight = 1.0 * window.innerHeight;

function processEvent(event) {
  const data = {
    x: event.clientX / windowWidth,
    y: event.clientY / windowHeight
  };
  return data;
}

function distributeData(peer, data) {
  eachConnection(peer, (connection) => {
    connection.send({
      type: 'event',
      payload: data
    });
  });
}

function handleLocalEvent(peer, event) {
  const data = processEvent(event);
  distributeData(peer, data);
  respondToData(data, peer.id);
}

function handleRemoteData(data, connection) {
  respondToData(data, connection.peer);
}

function respondToData(data, peerId) {
  if (store.members.has(peerId)) {
    store.updateMember(peerId, data);
  }
}






const hostId = document.location.pathname.split('/')[1];
const session = PeerSession.setup(hostId);
console.log(session.peer.id)

store.setHostId(session.hostId);
store.setId(session.peer.id);
store.addMember(session.peer.id);

// handle inital connections
eachConnection(session.peer, (connection) => {
  store.addMember(connection.peer);
  setupConnectionHandlers(connection, session.peer);
});

// handle potential future connections
session.peer.on('connection', (connection) => {
  store.addMember(connection.peer);
  setupConnectionHandlers(connection, session.peer);
});

if (session.mode === PeerSession.MODES.HOST) {
  window.history.pushState({}, session.hostId, `/${session.hostId}`);
  // send list of other connected peers to newly connected peer
  session.peer.on('connection', (newConnection) => {
    const otherConnections = Object.keys(session.peer.connections);
    console.log('send back', otherConnections)
    newConnection.send({
      type: 'connectTo',
      payload: otherConnections
    });
  });
}

window.addEventListener('mousemove', (event) => {
  handleLocalEvent(session.peer, event);
});
