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

import logo from "../../assets/img/logo.svg";

class Audit2Navbar extends Component {
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
        {' Arko Systems - 2˚ Auditoria'}</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#/audit2/dashboard">
              Dashboard
            </Nav.Link>
            <Nav.Link eventKey={1} href="#/audit2/equipe">
              Equipe
            </Nav.Link>
          </Nav>
          <Button variant="outline-info" href="#/auth/login" onClick={()=>localStorage.clear()}>Sair</Button>
        </Navbar.Collapse>
      </Navbar>

      

    );
  }
}

export default Audit2Navbar;
