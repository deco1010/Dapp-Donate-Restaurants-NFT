import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route  } from 'react-router-dom';
import Web3 from 'web3';

import './App.css';
import Navbar from './components/layout/Navbar';
import RestaurantsBlockchain from './abis/Restaurants.json';
import Restaurants from './components/Restaurants';
import Restaurant from './components/Restaurant';
import AddRestaurant from './components/AddRestaurant';

class App extends Component{
  state = {
    account: '',
    restaurantCount: 0,
    restaurantsBlockchain: null,
    restaurants: [],
    donationList: []
  }

  async componentWillMount(){
    await this.loadWeb3();
    await this.loadBlockchainData();
    await this.getRestaurant();
  }

  async loadBlockchainData(){
    const web3 = window.web3;

    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const networkData = RestaurantsBlockchain.networks[networkId];

    if(networkData){
      const abi = RestaurantsBlockchain.abi;
      const address = RestaurantsBlockchain.networks[networkId].address;

      const restaurantsBlockchain = new web3.eth.Contract(abi, address);
      this.setState({ restaurantsBlockchain });

      const restaurantCount = await restaurantsBlockchain.methods.restaurantCount().call();
      this.setState({ restaurantCount });
    }else{
      window.alert('Contract is not deployed to detected network')
    }
  }

  async loadWeb3(){
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);

      await window.ethereum.enable();
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async getRestaurant(){
    for(let i = 0; i < this.state.restaurantCount; i++){
      const restaurant = await this.state.restaurantsBlockchain.methods.restaurants(i + 1).call();
      this.setState({ restaurants: [...this.state.restaurants, restaurant] });
    }
  }

  async createRestaurant(name, location, imageURL, description, amount){
    await this.state.restaurantsBlockchain.methods
      .createRestaurant(name, description, location, imageURL, window.web3.utils.toWei(amount.toString(), 'Ether'))
      .send({ from: this.state.account });
  }

  async donateRestaurant(id, amount){
    await this.state.restaurantsBlockchain.methods
      .donateETHToRestaurant(id)
      .send({ from: this.state.account, value: window.web3.utils.toWei(amount.toString(), 'Ether') });
  }

  async getDonationLog(){
    const transactions = await this.state.restaurantsBlockchain?.getPastEvents('DonationForRestaurant', { fromBlock: 0, toBlock: 'latest'});
    this.setState({ donationList: transactions });
  }

  render(){
    return (
      <Router className="App">
        <Navbar />
        <Switch>
          <Route path="/add-restaurant">
            <AddRestaurant createRestaurant={this.createRestaurant.bind(this)}/>
          </Route>
          <Route path="/restaurant/:id">
            <Restaurant
              restaurants={this.state.restaurants}
              donationList={this.state.donationList}
              donateRestaurant={this.donateRestaurant.bind(this)}
              getDonationLog={this.getDonationLog.bind(this)} />
          </Route>
          <Route path="/">
            <Restaurants restaurants={this.state.restaurants} />
          </Route>
        </Switch>
      </Router>
    );
  }
}

export default App;
