const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 감쌀 웹앱 주소 (GitHub Pages)
const APP_URL = 'https://kanghyojeong2298.github.io/tax-client-manager/';
const APP_HOST = 'kanghyojeong2298.github.io';

// 창 크기/위치 기억용 파일
const stateFile = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch (e) {
    return { width: 1400, height: 900 };
  }
}

function saveWindowState(win) {
  try {
    if (!win.isMinimized() && !win.isFullScreen()) {
      fs.writeFileSync(stateFile, JSON.stringify(win.getBounds()));
    }
  } catch (e) {}
}

let mainWindow;

function createWindow() {
  const state = loadWindowState();

  mainWindow = new BrowserWindow({
    width: state.width || 1400,
    height: state.height || 900,
    x: state.x,
    y: state.y,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#ffffff',
    show: false,
    title: '세무법인 엑스퍼트 강남 - 고객관리 시스템',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  mainWindow.loadURL(APP_URL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 외부 도메인 링크(메일, 구글 등)는 기본 브라우저로 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 앱 내에서 다른 도메인으로 이동 시 외부 브라우저로
  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const target = new URL(url);
      if (target.host !== APP_HOST) {
        event.preventDefault();
        shell.openExternal(url);
      }
    } catch (e) {}
  });

  // 인터넷 끊김 등 로딩 실패 안내
  mainWindow.webContents.on('did-fail-load', (e, code, desc, validatedURL, isMainFrame) => {
    if (isMainFrame && code !== -3) {
      dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: '연결 오류',
        message: '페이지를 불러오지 못했습니다.',
        detail: '인터넷 연결을 확인한 뒤 "다시 시도"를 눌러주세요.\n\n(' + desc + ')',
        buttons: ['다시 시도', '닫기']
      }).then(r => {
        if (r.response === 0) mainWindow.loadURL(APP_URL);
      });
    }
  });

  ['resize', 'move', 'close'].forEach(ev =>
    mainWindow.on(ev, () => saveWindowState(mainWindow))
  );

  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        { label: '새로고침', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.reload() },
        { label: '홈으로', click: () => mainWindow && mainWindow.loadURL(APP_URL) },
        { type: 'separator' },
        { label: '종료', role: 'quit' }
      ]
    },
    {
      label: '편집',
      submenu: [
        { label: '실행 취소', role: 'undo' },
        { label: '다시 실행', role: 'redo' },
        { type: 'separator' },
        { label: '잘라내기', role: 'cut' },
        { label: '복사', role: 'copy' },
        { label: '붙여넣기', role: 'paste' },
        { label: '모두 선택', role: 'selectAll' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { label: '확대', role: 'zoomIn' },
        { label: '축소', role: 'zoomOut' },
        { label: '기본 크기', role: 'resetZoom' },
        { type: 'separator' },
        { label: '전체화면', role: 'togglefullscreen' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// 단일 인스턴스 (중복 실행 방지)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    buildMenu();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
