import { useEffect, useState } from "react";
import { loadWallet, walletEventName, walletStorageKey, type WalletState } from "../store/wallet";

export function useWallet(): WalletState {
  const [wallet, setWallet] = useState(loadWallet);

  useEffect(() => {
    const refresh = () => setWallet(loadWallet());
    const onStorage = (event: StorageEvent) => {
      if (event.key === walletStorageKey) refresh();
    };
    window.addEventListener(walletEventName, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(walletEventName, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return wallet;
}
