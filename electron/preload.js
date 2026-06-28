import { contextBridge, ipcRenderer } from 'electron';

// واجهة واحدة موحّدة: window.api.invoke(channel, payload)
// أي موديول جديد (HR, Billing, Inventory..) هيستخدم نفس النمط ده تمامًا
contextBridge.exposeInMainWorld('api', {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
});
