import React, { useState } from "react";

const TipoCambioForm = () => {
  const [initialDate, setInitialDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formatDate = (date) => {
      const [year, month, day] = date.split("-");
      const newdate = day + "-" +month + "-" +year;
      return  newdate
    };

    const requestData = {
      initialDate: formatDate(initialDate),
      endDate: formatDate(endDate),
    };

    try {
      const response = await fetch("http://localhost:5000/TipoCambioRangoPromedio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Error en la solicitud"); 
      }

      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Hubo un error:", error);
    }
  };

  const fetchHistorico = async () => {
    try {
      const response = await fetch("http://localhost:5000/logs");
      if (!response.ok) {
        throw new Error("Error al obtener datos históricos");
      }
      const data = await response.json();
      setHistorico(data);
    } catch (error) {
      console.error("Hubo un error:", error);
    }
  };

  return (
    <div>
      <h2>Consultar Tipo de Cambio</h2>
      <form onSubmit={handleSubmit}>
        <label>Fecha inicial:</label>
        <input type="date" value={initialDate} onChange={(e) => setInitialDate(e.target.value)} />

        <label>Fecha final:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <button type="submit">Consultar</button>
      </form>

      {resultado && (
        <div>
          <h3>Resultado:</h3>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}

      <button onClick={fetchHistorico}>Mostrar Histórico</button>

      {historico && (
        <div>
          <h3>Datos Históricos</h3>
          <table border="1">
            <thead>
              <tr>
                <th>No. Petición</th>
                <th>Fecha Inicial</th>
                <th>Fecha Final</th>
                <th>TC Venta</th>
                <th>TC Compra</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{new Date(item.fecha_inicial).toLocaleDateString()}</td>
                  <td>{new Date(item.fecha_final).toLocaleDateString()}</td>
                  <td>{item.tc_venta}</td>
                  <td>{item.tc_compra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TipoCambioForm;