/** @jsx React.DOM */
'use strict';

var React = require('react/addons');
var cx = React.addons.classSet;
var github = require('./models/github.js');
var auth = require('./routes/auth.js');
var user = require('./models/user');
var xhr = require('xhr');

var config = require('../../config.json');
var META = config.meta;
var TOKEN_URL = config.token_url;

// Pages
var Map = require('./map/map.js');
var Table = require('./table/table.js');
var NotFound = require('./statics/notfound.js');

// Router
var Router = require('react-router');
var Routes = Router.Routes;
var Route = Router.Route;
var Link = Router.Link;
var NotFoundRoute = Router.NotFoundRoute;
var DefaultRoute = Router.DefaultRoute;
var ActiveState = Router.ActiveState;

var App = React.createClass({
  displayName: 'AppComponent',

  mixins: [auth, ActiveState],

  getInitialState: function() {
    return {
      repo: {},
      meta: {},
      isTableActive: null,
      loggedIn: false
    };
  },

  updateActiveState: function () {
    // check if the current router is table or map
    // will see update from react-router
    this.setState({
      isTableActive: App.isActive('table', undefined, undefined)
    })
  },

  componentWillMount: function() {
    xhr({ responseType: 'json', url: META, timeout: 100 * 1000}, meta_response.bind(this))

    function meta_response(err, resp, meta) {
      // get repo meta meta
      github.getPublicRepo(meta.owner, meta.repo, function(err, data) {
        if(err) console.log('get repo meta err', err)
        this.setState({
          meta: meta,
          repo: data
        })
      }.bind(this))

      this.setState({loggedIn: user.loggedIn()})
    }

  },

  logout: function(e) {
    e.preventDefault()
    user.logout()
    this.setState({loggedIn: false})
  },

  render: function() {
    var loginOrOut = this.state.loggedIn ?
      <a onClick={this.logout}>Logout</a> :
      <a href={TOKEN_URL}>Login</a>;

    var profile = this.state.loggedIn ?
      <a href={this.state.repo.html_url} target='_blank'><img className='avatar' src={user.attrs.avatar_url} alt={user.attrs.name} />{user.attrs.name}</a> :
      '';

    var map_classes = cx({
      'map': true,
      'active': !this.state.isTableActive
    })

    var table_classes = cx({
      'data': true,
      'active': this.state.isTableActive
    })

    return (
      <div>
        <header id='header'>
          <nav className='user'>
            {profile}

            {loginOrOut}
          </nav>

          <nav className='links'>
            <a href='/' className='logo'>
              <img src='./dist/assets/images/logo.png' alt='CSViz' />
              <span>Go to CSViz.org</span>
            </a>
            <a href={this.state.repo.html_url} target='_blank'>{this.state.repo.full_name}</a>
            <span className='tabs'>
              <Link to="map"><button className={map_classes}><span>Map</span></button></Link>
              <Link to="table"><button className={table_classes}><span>Data</span></button></Link>
            </span>
          </nav>
        </header>

        <this.props.activeRouteHandler meta={this.state.meta} loggedIn={this.state.loggedIn} />
      </div>
    );
  }
});

var routes = (
  <Routes>
    <Route name="app" handler={App}>
      <Route name='map' path='/' handler={Map} />
      <Route name='table' path='/table' handler={Table} />
      <DefaultRoute handler={Map} />
    </Route>
    <NotFoundRoute name='notfound' handler={NotFound} />
  </Routes>
);

React.renderComponent(routes, document.body);
