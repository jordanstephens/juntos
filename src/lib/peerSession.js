import Peer from "peerjs";
import { v4 as uuid } from "uuid";

export const MODES = {
  HOST: 'host',
  PEER: 'peer'
};

const PEER_JS_KEY = "8h8k7uq3kezpk3xr";
const peerOpts = { debug: 3 };

function generatePeerId() {
  return uuid().replace(/-/g, '');
}

export function setup(hostId) {
  const mode = hostId ? MODES.PEER : MODES.HOST;
  hostId = hostId || generatePeerId();
  const myId = mode === MODES.HOST ? hostId : generatePeerId();

  const peer = new Peer(myId, {
    key: PEER_JS_KEY
  }, peerOpts);

  if (mode === MODES.PEER) {
    peer.connect(hostId);
  }

  peer.on('error', (error) => {
    console.error(error);
  });

  return {
    peer,
    mode,
    hostId
  };
}
