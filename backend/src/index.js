const soap = require('soap');
const express = require('express');
const cors = require("cors");
const app = express();
const port = 5000;
const url = 'https://www.banguat.gob.gt/variables/ws/TipoCambio.asmx?WSDL';
const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'test2155',
  server: 'localhost',
  database: 'test',
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

async function verificarConexion() {
  sql.connect(config).then(pool => {
    console.log('Conectado a SQL Server');
  }).catch(err => {
    console.error('Error de conexión:', err);
  });

}

async function insertarLog(fechaInicial, fechaFinal, tcVenta, tcCompra) {
  try {
    let pool = await sql.connect(config);
    let resultado = await pool.request()
      .input('fecha_inicial', sql.Date, fechaInicial)
      .input('fecha_final', sql.Date, fechaFinal)
      .input('tc_venta', sql.Float, tcVenta)
      .input('tc_compra', sql.Float, tcCompra)
      .query(`INSERT INTO logs (fecha_inicial, fecha_final, tc_venta, tc_compra) 
                    VALUES (@fecha_inicial, @fecha_final, @tc_venta, @tc_compra)`);

    console.log('Registro insertado:', resultado.rowsAffected);
    await sql.close();
  } catch (error) {
    console.error('Error al insertar datos:', error);
  }
}



app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  verificarConexion();
  res.json({ mensaje: 'Server Test' });
});

app.get('/logs', async (req, res) => {
  try {
    let pool = await sql.connect(config);
    let result = await pool.request().query('SELECT * FROM logs');
    //console.log('Resultados:', result.recordset);
    res.json(result.recordset);
    sql.close();
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
  }
});

app.get('/VariablesDisponibles', async (req, res) => {
  try {
    soap.createClient(url, (err, client) => {
      if (err) {
        console.error('Error al crear el cliente SOAP:', err);
        res.status(500).json({ msg: 'Error al crear el cliente SOAP' });
        return;
      }

      client.VariablesDisponibles({}, (err, result) => {
        if (err) {
          console.error('Error al llamar al servicio:', err);
          res.status(500).json({ msg: 'Error al crear el cliente SOAP' });
          return;
        }
        res.status(200).json(result);
      });
    });
  } catch (error) {
    res.status(501).json({ msg: 'Internal server error' });
    console.error(error);
  }
});

app.get('/TipoCambioRango', async (req, res) => {

  try {
    const { initialDate, endDate } = req.body;
    const args = {
      fechainit: initialDate,
      fechafin: endDate
    }
    soap.createClient(url, (err, client) => {
      if (err) {
        console.error('Error al crear el cliente SOAP:', err);
        res.status(500).json({ msg: 'Error al crear el cliente SOAP' });
        return;
      }

      client.TipoCambioRango(args, (err, result) => {
        if (err) {
          console.error('Error al llamar al servicio:', err);
          res.status(500).json({ msg: 'Error al crear el cliente SOAP' });
          return;
        }

        console.log('Respuesta del servicio:', result);
        res.status(200).json(result);

      });
    });
  } catch (error) {
    res.status(501).json({ msg: 'Internal server error' });
    console.error(error);
  }
});

app.post('/TipoCambioRangoPromedio', async (req, res) => {

  try {
    const { initialDate, endDate } = req.body;
    console.log(initialDate)
    console.log(endDate)
    const args = {
      fechainit: initialDate,
      fechafin: endDate
    }
    soap.createClient(url, (err, client) => {
      if (err) {
        console.error('Error al crear el cliente SOAP:', err);
        res.status(500).json({ msg: 'Error al crear el cliente SOAP' });
        return;
      }

      client.TipoCambioRango(args, (err, result) => {
        if (err) {
          console.error('Error al llamar al servicio:', err);
          res.status(500).json({ msg: 'Error al crear el cliente SOAP' });
          return;
        }
        const tiposdecambioArray = result.TipoCambioRangoResult.Vars.Var;
        const promedioVenta = tiposdecambioArray.reduce((sum, item) => sum + item.venta, 0) / tiposdecambioArray.length;
        const promedioCompra = tiposdecambioArray.reduce((sum, item) => sum + item.compra, 0) / tiposdecambioArray.length;

        console.log(`Promedio Venta: ${promedioVenta.toFixed(5)}`);
        console.log(`Promedio Compra: ${promedioCompra.toFixed(5)}`);

        insertarLog(initialDate, endDate, promedioVenta.toFixed(5), promedioCompra.toFixed(5));
        res.status(200).json({ "Promedio Venta:": promedioVenta.toFixed(5), "Promedio Compra:": promedioCompra.toFixed(5) });

      });
    });
  } catch (error) {
    res.status(501).json({ msg: 'Internal server error' });
    console.error(error);
  }
});

app.listen(port, () => {
  console.log(`API escuchando en http://localhost:${port}`);
}); 