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

import logo from "../../assets/img/logo.png";

class AdminNavbar extends Component {
  render() {
    return (
      <Navbar collapseOnSelect bg="dark" variant="dark" expand="md">
        <Navbar.Brand>
          <img
            src={logo}
            height="30"
            className="d-inline-block align-top"
            alt="React Bootstrap logo"
          /></Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="#/admin/dashboard">
              Dashboard
            </Nav.Link>
            <Nav.Link eventKey={1} href="#/admin/equipe">
              Equipe
            </Nav.Link>
            <Nav.Link eventKey={2} href="#/admin/enderecamento">
              Enderecamento
            </Nav.Link>
          </Nav>
          <Button variant="outline-info" href="#/auth/login" onClick={()=>localStorage.clear()}>Sair</Button>
        </Navbar.Collapse>
      </Navbar>
    );
  }
}

export default AdminNavbar;
