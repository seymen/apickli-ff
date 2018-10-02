Feature: setting query parameters

  Scenario: set hard coded query parameter
    Given I set foo query parameter to bar
    When I GET /get
    Then response body path $.args.foo should be bar

  Scenario: set query parameter to a variable
    Given I set foo query parameter to `var1`
    When I GET /get
    Then response body path $.args.foo should be bar

  Scenario: set duplicate query parameters
    Given I set foo query parameter to bar
    And I set foo query parameter to baz
    When I GET /get
    Then response body path $.args.foo[0] should be bar
    And response body path $.args.foo[1] should be baz

  Scenario: resolve undefined variable value
    Given I set foo query parameter to `not-defined`
    When I GET /get
    Then response body path $.args.foo should be not-defined

  Scenario: set multiple query parameters
    Given I set foo query parameter to bar
    And I set baz query parameter to boo
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

  Scenario: set duplicate query parameters from table
    Given I set query parameters to
      | name | value |
      | foo  | bar   |
      | foo  | boo   |
    When I GET /get
    Then response body path $.args.foo[0] should be bar
    And response body path $.args.foo[1] should be boo