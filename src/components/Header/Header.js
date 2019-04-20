import React, { Component } from "react";
import { 
  Navbar,
  Nav,
  NavDropdown, 
  Form,
  FormControl,
  Button,
  NavItem 
} from "react-bootstrap";
import logo from "./../../assets/img/logo.svg";
import dashboardRoutes from "../../routes/dashboard";

class Header extends Component {
  render() {
    return (
      <Navbar collapseOnSelect bg="dark" variant="dark" expand="md">
        <Navbar.Brand>
          <img
            src={logo}
            width="30"
            height="30"
            className="d-inline-block align-top"
            alt="React Bootstrap logo"
          />
        {' Arko Systems'}</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#Dashboard">
              Dashboard
            </Nav.Link>
            <Nav.Link eventKey={1} href="#Relatorios">
              Relatórios
            </Nav.Link>
            <Nav.Link eventKey={2} href="#Equipe">
              Equipe
            </Nav.Link>
            <Nav.Link eventKey={3} href="#Enderecamento">
              Enderecamento
            </Nav.Link>
            <Nav.Link eventKey={4} href="#Confronto">
              Confronto
            </Nav.Link>
            <Nav.Link eventKey={5} href="#Auditoria">
              Auditoria
            </Nav.Link>
            <Nav.Link eventKey={6} href="#Login">
              Login
            </Nav.Link>
            <Nav.Link eventKey={7} href="#Inventario">
              Inventario
            </Nav.Link>
            <Nav.Link eventKey={8} href="#Divergencia">
              Divergencia
            </Nav.Link>
          </Nav>
          <Button variant="outline-info">Sair</Button>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default Header;
