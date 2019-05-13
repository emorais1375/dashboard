import React, { Component } from "react";
import mysql from 'mysql';
import env from '../../../.env'
import { 
    FormCheck, 
    Container, 
    Col, 
    Form, 
    Table,
    ButtonToolbar,
    Button,
    Row
} from "react-bootstrap";
import { truncateSync } from "fs";

class Enderecamento extends Component {
    constructor(props) {
        super(props);
        this.state = {
            enderecamento: [],
            tipo_inventario: localStorage.getItem('inv_tipo') || '',
            prefixo: '',
            inicial: '', final: '',
            inventario_id: localStorage.getItem('inv_id') || '',
        }; 
        this.handleChange = this.handleChange.bind(this);
        this.handleChange2 = this.handleChange2.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }
    componentDidMount() {
        this.atualizaLista();
    }
    atualizaLista() {
        let {inventario_id} = this.state;
        if (inventario_id) {
            let connection = mysql.createConnection(env.config_mysql);
            let query = `
                SELECT 
                    e.id,
                    e.descricao,
                    e.excecao 
                FROM 
                    enderecamento e 
                WHERE 
                    e.inventario_id = ?
                ORDER BY
                    e.id DESC 
                -- LIMIT 10
            `

            connection.query(query, [inventario_id],(error, enderecamento, fields) => {
                if(error){
                    console.log(error.code,error.fatal)
                    return
                }
                this.setState({enderecamento});
                query = `
                    SELECT
                        e.descricao 'desc',
                        i.tipo_inventario 'tipo'
                    FROM
                        enderecamento e,
                        inventario i
                    WHERE
                        e.id = (
                            SELECT
                                MAX(id) 
                            FROM
                                enderecamento
                            WHERE
                                inventario_id = ?
                        )
                    AND
                        i.id = ?
                `

                connection.query(query, [inventario_id, inventario_id],(error, results, fields) => {
                    if(error){
                        console.log(error.code,error.fatal);
                        return;
                    }
                    if (results.length) {
                        const prefixo = results[0].desc.split('-')[0];
                        const inicial = results[0].desc.split('-')[1];
                        const tipo_inventario = results[0].tipo;
                        this.setState({prefixo, inicial, tipo_inventario});
                    }
                    connection.end();
                })
            })
        } else {
            console.log('Vazio!')
        }
    }
    handleChange2(ev) {
        const target = ev.target
        const value = target.value
        const name = target.name
        this.setState({
          [name]: value
        })
    }
    handleChange(ev, key) {
        const target = ev.target
        const checked = target.checked
        const enderecamento = this.state.enderecamento.slice()
        const enderecamento_id = enderecamento[key].id
        const excecao = checked ? 'SIM' : 'NAO'
        let connection = mysql.createConnection(env.config_mysql)
        const query = `
            UPDATE 
                enderecamento
            SET 
                excecao = ?
            WHERE 
                id = ?
        `

        connection.query(query, [excecao, enderecamento_id], (error, results, fields) => {
            if(error){
                console.log(error.code,error.fatal)
                return
            }
            enderecamento[key].excecao = excecao
            this.setState({enderecamento})
            connection.end()
        })
      }
    handleSubmit(ev) {
        ev.preventDefault()
        let final = this.state.final
        final = parseInt(final)
        let inicial = this.state.inicial
        inicial = parseInt(inicial)
        let prefixo = this.state.prefixo
        const enderecamento = this.state.enderecamento.slice()
        let enderecamentos = []
        let descricao
        const descricao_proprietario = ''
        const excecao = 'NAO'
        const inventario_id = this.state.inventario_id
        if (final > inicial) {
            for (let i = inicial+1; i <= final; i++) {
                descricao = prefixo + '-' + i
                enderecamentos.push([
                    inventario_id,
                    descricao,
                    descricao_proprietario,
                    excecao
                ])
            }
            let connection = mysql.createConnection(env.config_mysql)
            let query = `
                INSERT INTO
                    enderecamento (inventario_id, descricao,
                        descricao_proprietario, excecao)
                VALUES ?
            `

            connection.query(query, [enderecamentos], (error, results, fields)=>{
                if(error) {
                  console.log('Puts:',error.code, error.fatal);
                  return;
                }
                console.log(results.affectedRows+' enderecamento(s) inserido(s)!')
                this.atualizaLista();
                this.handleCancel();
                connection.end();
            })
        } else {
            console.log('Entrada invalida!')
        }
    }
    handleCancel() {
        if (this.state.final) {
            this.setState({final: ''})
        }
    }
  render() {
    const tipo_inventario = this.state.tipo_inventario;
    let thArray;
    let tbody;
    if (tipo_inventario !== 'VARREDURA') {
        thArray = ["#", "Endereço", "Excecao"];
    } else {
        thArray = ["#", "Endereço"];
    }
    return (
      <div>
        <h1>Enderecamento</h1>
        <Container fluid>
          <Row>
            <Col md={12}>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Row>
                        <Form.Group as={Col} md="4">
                            <Form.Label>Prefixo</Form.Label>
                            <Form.Control  readOnly defaultValue={this.state.prefixo} />
                        </Form.Group>

                        <Form.Group as={Col} md="4">
                            <Form.Label>Início</Form.Label>
                            <Form.Control readOnly defaultValue={this.state.inicial} />
                        </Form.Group>

                        <Form.Group as={Col} md="4">
                            <Form.Label>Final</Form.Label>
                            <Form.Control placeholder="Final" type="number" name="final"  onChange={this.handleChange2} value={this.state.final} />
                        </Form.Group>
                    </Form.Row>
                    <ButtonToolbar>
                        <Button as="input" variant="info" type="submit" value="Salvar"/>
                        <Button as="input" variant="info" type="button" value="Cancelar" onClick={this.handleCancel}/>
                    </ButtonToolbar>
                </Form>
            </Col>
            <Col md={12} style={{
                overflow: 'auto',
                height: '383px'
            }}>
                <Table  striped>
                    <thead>
                        <tr>
                            {thArray.map((prop, key) => {
                                return <th key={key}>{prop}</th>;
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.enderecamento.map((prop,key) => {
                            return (
                                <tr key={prop.id}>
                                    <td>{prop.id}</td>
                                    <td>{prop.descricao}</td>
                                    {tipo_inventario !== 'VARREDURA' &&
                                        <td >
                                            <Form.Check 
                                                checked={prop.excecao === 'SIM'? true:false}
                                                onChange={e => this.handleChange(e, key)}/>
                                        </td>
                                    }
                                </tr>
                            );
                        })}                       
                    </tbody>
                </Table>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default Enderecamento;