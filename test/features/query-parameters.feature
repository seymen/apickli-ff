Feature: setting query parameters

  Scenario: set hard coded query parameter
    Given I set query parameter foo to bar
    When I GET /get
    Then response body path $.args.foo should be bar

  Scenario: set query parameter to a variable
    Given I set query parameter foo to `var1`
    When I GET /get
    Then response body path $.args.foo should be bar

  Scenario: set same query parameter twice
    Given I set query parameter foo to bar
    And I set query parameter foo to baz
    When I GET /get
    Then response body path $.args.foo should be baz

  Scenario: resolve undefined variable value
    Given I set query parameter foo to `not-defined`
    When I GET /get
    Then response body path $.args.foo should be not-defined

  Scenario: set multiple query parameters
    Given I set query parameter foo to bar
    And I set query parameter baz to boo
    When I GET /get
    Then response body path $.args.foo should be bar
    And response body path $.args.baz should be boo

  Scenario: set query parameters from table
    Given I set query parameters to
      | name | value |
      | foo  | bar   |
      | baz  | boo   |
    When I GET /get
    Then response body path $.args.foo should be bar
    And response body path $.args.baz should be boo