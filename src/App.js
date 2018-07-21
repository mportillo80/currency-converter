import React, { Component } from 'react';
import fx from 'money';
import './App.css';

class CurrencyConverter extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currencyTypes: [],
      baseInput: '0.00',
      baseSelect: '',
      equivalentInput: '0.00',
      equivalentSelect: '',
      showFromError: false,
      showToError: false,
      fromErrorType: null,
      toErrorType: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.onKeyPressed = this.onKeyPressed.bind(this);
  }

  /**
   * @desc: load currency types and currency rates from respective endpoints
   * set defaults, currency types in state, initial calculation and fx settings
   */

  componentWillMount() {
    Promise.all([getCurrencyTypes(), getCurrencyRates()]).then(res => {
      this.setState({
        currencyTypes: res[0],
        baseSelect: 'USD',
        equivalentSelect: 'USD'
      });

      fx.base = res[1].base;
      fx.rates = res[1].rates;

      this.calculate(this.state.baseInput, 'baseSelect', this.state.baseSelect);
    });

    // get currency types (drop-down options)
    function getCurrencyTypes() {
      const baseUrl = 'https://gist.githubusercontent.com';
      const path =
        '/mddenton/062fa4caf150bdf845994fc7a3533f74/raw/27beff3509eff0d2690e593336179d4ccda530c2/Common-Currency.json';

      return fetch(`${baseUrl}${path}`)
        .then(res => res.json())
        .then(data => {
          const currArr = [];

          for (const prop in data) {
            currArr.push(data[prop]);
          }

          return currArr;
        });
    }

    // get currency rates (to associate with currency types retrieved)
    function getCurrencyRates() {
      const baseUrl = 'http://data.fixer.io';
      const path = '/api/latest?access_key=d0f3b7da0757140a192df5c5ee3fd3cf';

      return fetch(`${baseUrl}${path}`).then(res => res.json());
    }
  }

  /**
   * @desc: calculate equivalent value based on base settings or equivalent drop-down change
   * @param baseValue: value from base input field
   * @param typeName: currency type field (baseSelect vs. equivalentSelect)
   * @param typeValue: base currency type value (e.g. USD)
   */

  calculate(baseValue, typeName, typeValue) {
    let baseSelectCode;
    let baseCurrencyType;
    let equivalentSelectCode;
    let equivalentCurrencyType;

    // setup based on whether base or equivalent select drop-down was manipulated
    if (typeName === 'baseSelect') {
      baseSelectCode = typeValue;
      baseCurrencyType = this.state.currencyTypes.find(
        ct => ct.code === typeValue
      );
      equivalentSelectCode = this.state.equivalentSelect;
      equivalentCurrencyType = this.state.currencyTypes.find(
        ct => ct.code === this.state.equivalentSelect
      );
    } else if (typeName === 'equivalentSelect') {
      baseSelectCode = this.state.baseSelect;
      baseCurrencyType = this.state.currencyTypes.find(
        ct => ct.code === this.state.baseSelect
      );
      equivalentSelectCode = typeValue;
      equivalentCurrencyType = this.state.currencyTypes.find(
        ct => ct.code === typeValue
      );
    }

    // attempt conversion and display respective error message if type is not available
    try {
      const conversion = fx.convert(baseValue, {
        from: baseSelectCode,
        to: equivalentSelectCode
      });

      this.setState({
        baseInput: baseCurrencyType.symbol + baseValue,
        equivalentInput:
          equivalentCurrencyType.symbol + parseFloat(conversion).toFixed(2),
        showFromError: false,
        showToError: false
      });
    } catch (e) {
      const matchingType = this.state.currencyTypes.find(
        ct => ct.code === typeValue
      );

      if (typeName === 'baseSelect') {
        this.setState({
          baseSelect: this.state.baseSelect, // reset to last working value
          showFromError: true,
          fromErrorType: matchingType.name
        });
      } else if (typeName === 'equivalentSelect') {
        this.setState({
          equivalentSelect: this.state.equivalentSelect, // reset to last working value
          showToError: true,
          toErrorType: matchingType.name
        });
      }
    }
  }

  /**
   * @desc: based on event, set up value for calculation
   * @param e: passed event
   * @param val: passed value (if baseInput)
   * @param action: determine if adding or deleting characters and update value for calculation
   */

  handleChange(e, val, action) {
    const matchingSymbol = this.state.currencyTypes.find(
      ct => ct.code === this.state.baseSelect
    ).symbol;
    const target = e.target;
    const name = target.name;
    let value = val ? val : target.value;

    // handle calculation based on either drop-down or input manipulation
    if (name.includes('Select')) {
      this.setState({
        [name]: value
      });

      this.calculate(
        this.state.baseInput.replace(matchingSymbol, ''),
        name,
        value
      );
    } else {
      value = value.replace(matchingSymbol, '');

      if (action === 'add') {
        value = (value * 10).toFixed(2);
      } else if (action === 'delete') {
        value = (value / 10).toFixed(2);
      }

      this.calculate(value, 'baseSelect', this.state.baseSelect);
    }
  }

  /**
   * @desc: set pointer at end of base input
   * @param e: passed event
   */

  setCursorPos(e) {
    const el = e.target;
    const len = el.value.length;

    setTimeout(function() {
      el.setSelectionRange(len, len);
    }, 0);
  }

  /**
   * @desc: manually override key press to handle cursor position, only allow numbers and prepare input for calculation
   * @param e: passed event
   */

  onKeyPressed(e) {
    e.preventDefault();

    const regex = /[0-9]/;
    let val;
    let action;

    if (!regex.test(e.key) && e.keyCode !== 8) {
      return false;
    } else {
      this.setCursorPos(e);
    }

    if (e.keyCode === 8) {
      action = 'delete';
      val = this.state.baseInput.slice(0, this.state.baseInput.length - 1);
    } else {
      action = 'add';
      val = this.state.baseInput + e.key;
    }

    this.handleChange(e, val, action);
  }

  render() {
    const { currencyTypes } = this.state;

    return (
      <div className="wrapper">
        <h3>Currency Converter</h3>
        <div className="currency-wrapper base-currency-container">
          <label>From :</label>
          <div>
            <input
              type="text"
              className="base-input control"
              name="baseInput"
              value={this.state.baseInput}
              onFocus={this.setCursorPos}
              onChange={this.handleChange}
              onKeyDown={this.onKeyPressed}
            />
            <select
              name="baseSelect"
              id="base-select"
              className="control"
              value={this.state.baseSelect}
              onChange={this.handleChange}
            >
              {currencyTypes.map(type => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          {this.state.showFromError ? (
            <ErrorMessage type={this.state.fromErrorType} />
          ) : null}
        </div>
        <div className="currency-wrapper equivalent-currency-container">
          <label>To :</label>
          <div>
            <input
              type="text"
              className="control"
              name="equivalentInput"
              value={this.state.equivalentInput}
              disabled
            />
            <select
              name="equivalentSelect"
              id="equivalent-select"
              className="control"
              value={this.state.equivalentSelect}
              onChange={this.handleChange}
            >
              {currencyTypes.map(type => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          {this.state.showToError ? (
            <ErrorMessage type={this.state.toErrorType} />
          ) : null}
        </div>
      </div>
    );
  }
}

class ErrorMessage extends React.Component {
  render() {
    return (
      <div className="error-msg">
        Error: Currency type "{this.props.type}" is unavailable for conversion.
      </div>
    );
  }
}

export default CurrencyConverter;
