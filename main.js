'use strict';

// Import parts of electron to use
const {app, BrowserWindow} = require('electron');
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Keep a reference for dev mode
let dev = false;
if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
  dev = true;
}

function createWindow() {
  startExpress();
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024, height: 768, show: false
  });

  // and load the index.html of the app.
  let indexPath;
  if ( dev && process.argv.indexOf('--noDevServer') === -1 ) {
    indexPath = url.format({
      protocol: 'http:',
      host: 'localhost:4000',
      pathname: 'index.html',
      slashes: true
    });
  } else {
    indexPath = url.format({
      protocol: 'file:',
      pathname: path.join(__dirname, 'dist', 'index.html'),
      slashes: true
    });
  }
  mainWindow.loadURL( indexPath );

  // Don't show until we are ready and loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Open the DevTools automatically if developing
    if ( dev ) {
      // mainWindow.webContents.openDevTools();
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function startExpress () {
  const server = require('./server')
  const mysql = require('mysql')
  const env = require('./.env')
  const inventario_id = 1

  server.get('/login', (req, res) => {
    let cpf = req.query.cpf || ''
    const pass = req.query.password || ''
    console.log('GET /login?cpf='+cpf+'&password='+pass)
    if (cpf.length === 11 && pass) {
      cpf = cpf.split('')
      cpf.splice( 3, 0, '.')
      cpf.splice( 7, 0, '.')
      cpf.splice(11, 0, '-')
      cpf = cpf.join('')
      let connection = mysql.createConnection(env.config_mysql)
      let query = `
        SELECT DISTINCT 
          l.usuario_id, l.username
        FROM 
          login l, usuario u, usuario_enderecamento ue
        WHERE 
          l.login_status = 'ATIVO'
        AND 
          l.usuario_id = u.id
        AND 
          u.cargo = 'INVENTARIANTE'
        AND 
          l.usuario_id = ue.usuario_id
        AND 
          ue.inventario_id = ?
        AND 
          l.password = ?
        AND 
          l.cpf = ?
      `
      connection.query(query, [inventario_id, pass, cpf], (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal)
          res.status(400).json({error:error.code})
          return
        }
        if (results.length) {
          let newresults = results[0]
          newresults['login'] = 0
          res.json(newresults)
        }
        else {
          console.log('CPF ou Senha inválida!')
          res.json({usuario_id: null,username: null,login: -1})
        }
        connection.end()
      })
    } else {
      console.log('CPF ou Senha inválida!')
      res.json({usuario_id: null,username: null,login: -1})
    }
  })

  server.get('/inventario', (req, res) => {
    console.log('GET /inventario')
    let connection = mysql.createConnection(env.config_mysql)
    let query = `
      SELECT 
        tipo_inventario, validade,
        fabricacao, lote, itens_embalagem,
        fornecedor, ignorar_zero_esq,
        ignorar_zero_direita, marca
      FROM inventario
      WHERE id = ?
    `
    connection.query(query, [inventario_id], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal)
        res.status(400).json({error:error.code})
        return
      }
      res.json(results.length ? results[0] : {
        "tipo_inventario": null,
        "validade": null,
        "fabricacao": null,
        "lote": null,
        "itens_embalagem": null,
        "marca": null,
        "fornecedor": null,
        "ignorar_zero_esq": null,
        "ignorar_zero_direita": null
      })
      connection.end()
    })
  })

  server.get('/enderecamento', (req, res) => {
    const { usuario_id } = req.query
    console.log('GET /enderecamento?usuario_id='+usuario_id)
    if (usuario_id) {
      let connection = mysql.createConnection(env.config_mysql)
      let query = `
        SELECT 
          ue.enderecamento_id, 
          e.descricao,
          e.excecao
        FROM 
          usuario_enderecamento ue, 
          enderecamento e
        WHERE 
          ue.inventario_id = ?
        AND
          ue.tipo = 'INVENTARIO'
        AND
          e.inventario_id = ?      
        AND 
          ue.usuario_id = ?
        AND 
          ue.enderecamento_id = e.id
      `
      connection.query(query, [inventario_id, inventario_id, usuario_id], (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal)
          res.status(400).json({error:error.code})
          return
        }
        res.json(results)
        connection.end()
      });
    } else {
      console.log('usuario_id inválido!')
      res.json([])
    }
  })

  server.post('/coleta', (req, res) => {
    console.log('POST /coleta')
    const coletas  = req.body || []
    let values = []

    for(var i=0; i< coletas.length; i++)
      values.push([
        coletas[i].inventario_id,
        coletas[i].tipo_coleta,
        coletas[i].usuario_id,
        coletas[i].data,
        coletas[i].hora,
        coletas[i].enderecamento,
        coletas[i].cod_barra,
        coletas[i].validade,
        coletas[i].fabricacao,
        coletas[i].lote,
        coletas[i].itens_embalagem,
        coletas[i].marca,
        coletas[i].fornecedor
      ])

    let connection = mysql.createConnection(env.config_mysql)
    let query = `
      INSERT INTO 
        coleta (inventario_id, tipo_coleta, usuario_id, data, hora, enderecamento,
                cod_barra, validade, fabricacao,
                lote, itens_embalagem, marca, fornecedor)
      VALUES ?
    `
    connection.query(query, [values], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal)
        res.status(400).json({error:error.code})
        return
      }
      res.json()
      connection.end()
    })
  })

  server.get('/base', (req, res) => {
    console.log('GET /base')
    let connection = mysql.createConnection(env.config_mysql)
    let query = `
      SELECT 
        cod_barra, descricao_item
      FROM 
        base
      WHERE
        inventario_id = ?
    `
    connection.query(query, [inventario_id], (error, results, fields)=>{
      if(error) {
        console.log(error.code,error.fatal)
        res.status(400).json({error:error.code})
        return
      }
      res.json(results)
      connection.end()
    })
  })

  server.get('/status_end', (req, res) => {
    console.log('POST /status_end')
    const {inventario_id, enderecamento_id, status} = req.query || ''
    if (inventario_id && enderecamento_id && status) {
      let values = [[inventario_id, enderecamento_id]]

      let connection = mysql.createConnection(env.config_mysql)
      let query = `
        UPDATE 
          usuario_enderecamento
        SET 
          status = ?
        WHERE 
          enderecamento_id = ?
        AND
          inventario_id = ?
      `
      connection.query(query, [status, enderecamento_id, inventario_id], (error, results, fields)=>{
        if(error) {
          console.log(error.code,error.fatal)
          res.status(400).json({error:error.code})
          return
        }
        res.json({msg: 'Enderecamento finalizado!'})
        connection.end()
      })
    } else {
      console.log('Dados inválido!')
      res.json({msg: 'Dados inválido!'})
    }
  })

  server.get('/', (req, res) => {
    console.log("GET /")
    res.json({message:'Servidor funcionando!'})
  })
}
