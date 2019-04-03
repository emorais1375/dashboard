import React, { Component } from "react";
import { 
  Navbar, Nav, NavDropdown, 
  Form, FormControl, Button,
  NavItem } from "react-bootstrap";

  import logo from "./../../assets/img/logo.svg";

// import HeaderLinks from "./HeaderLinks.jsx";

import dashboardRoutes from "../../routes/dashboard";

class Header extends Component {
  // constructor(props) {
  //   super(props);
  //   this.mobileSidebarToggle = this.mobileSidebarToggle.bind(this);
  //   this.state = {
  //     sidebarExists: false
  //   };
  // }
  // mobileSidebarToggle(e) {
  //   if (this.state.sidebarExists === false) {
  //     this.setState({
  //       sidebarExists: true
  //     });
  //   }
  //   e.preventDefault();
  //   document.documentElement.classList.toggle("nav-open");
  //   var node = document.createElement("div");
  //   node.id = "bodyClick";
  //   node.onclick = function() {
  //     this.parentElement.removeChild(this);
  //     document.documentElement.classList.toggle("nav-open");
  //   };
  //   document.body.appendChild(node);
  // }
  // getBrand() {
  //   var name;
  //   dashboardRoutes.map((prop, key) => {
  //     if (prop.collapse) {
  //       prop.views.map((prop, key) => {
  //         if (prop.path === this.props.location.pathname) {
  //           name = prop.name;
  //         }
  //         return null;
  //       });
  //     } else {
  //       if (prop.redirect) {
  //         if (prop.path === this.props.location.pathname) {
  //           name = prop.name;
  //         }
  //       } else {
  //         if (prop.path === this.props.location.pathname) {
  //           name = prop.name;
  //         }
  //       }
  //     }
  //     return null;
  //   });
  //   return name;
  // }
  render() {
    return (
      // <Navbar  bg="dark" variant="dark">
      //   <Navbar.Header>
      //     <Navbar.Brand>
      //       <a href="#pablo">{this.getBrand()}</a>
      //       Dashboard
      //     </Navbar.Brand>
      //     <Navbar.Toggle onClick={this.mobileSidebarToggle} />
      //   </Navbar.Header>
      //   <Navbar.Collapse>
      //     <HeaderLinks />
      //   </Navbar.Collapse>
      // </Navbar>
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
          </Nav>
          <Button variant="outline-info">Sair</Button>
        </Navbar.Collapse>
      </Navbar>

      

    );
  }
}

export default Header;
