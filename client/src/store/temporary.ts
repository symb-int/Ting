import { atomWithLocalStorage } from '~/store/utils';

/**
 * Temporary chats are outside the TING I01 text-chat scope. Normalize legacy
 * LibreChat preferences during atom initialization so a hidden stored value
 * cannot silently turn a new TING conversation into an ephemeral one.
 */
const isTemporary = atomWithLocalStorage('isTemporary', false, () => false);
const defaultTemporaryChat = atomWithLocalStorage('defaultTemporaryChat', false, () => false);

export default {
  isTemporary,
  defaultTemporaryChat,
};
