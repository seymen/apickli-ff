Feature: Request header feature

  Scenario: set request header to a string
    Given I set User-Agent header to apickli
    When I GET /get
    Then response body path $.headers.User-Agent should be apickli

  Scenario: set request header to a variable
    Given I set User-Agent header to `userAgent`
    When I GET /get
    Then response body path $.headers.User-Agent should be apickli

  Scenario: set multiple request headers
    Given I set User-Agent header to `userAgent`
    And I set Foo header to bar
    When I GET /get
    Then response body path $.headers.User-Agent should be apickli
    And response body path $.headers.Foo should be bar

  Scenario: set same request header twice
    Given I set User-Agent header to `userAgent`
    And I set User-Agent header to bar
    When I GET /get
    Then response body path $.headers.User-Agent should be bar

  Scenario: resolve undefined header
    Given I set User-Agent header to `not-defined`
    When I GET /get
    Then response body path $.headers.User-Agent should be not-defined

  Scenario: set headers from table
    Given I set headers to
      | name | value |
      | Foo  | bar   |
      | Baz  | boo   |
    When I GET /get
    Then response body path $.headers.Foo should be bar
    And response body path $.headers.Baz should be boo

  Scenario: set duplicate headers
    Given I set Foo header to bar
    And I set Foo header to baz
    When I GET /get
    Then response body path $.headers.Foo should be baz

  Scenario: set duplicate headers from table
    Given I set headers to
      | name | value |
      | Foo  | bar   |
      | Foo  | baz   |
    When I GET /get
    Then response body path $.headers.Foo should be baz

  Scenario: response header not exists
    When I GET /get
    Then response header blah should not exist
