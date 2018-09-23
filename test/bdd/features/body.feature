Feature: Request body feature

  Scenario: send form parameters using Content-Type header
    Given I set Content-Type header to application/x-www-form-urlencoded
    And I set body to username=foo&password=bar
    When I POST to /post
    Then response body path $.form.username should be foo
    And response body path $.form.password should be bar

  Scenario: send form parameters
    Given I set form parameter username to foo
    And I set form parameter password to bar
    When I POST to /post
    Then response body path $.form.username should be foo
    And response body path $.form.password should be bar

  Scenario: send form parameters using table
    Given I set form parameters to
      | name     | value |
      | username | foo   |
      | password | bar   |
    When I POST to /post
    Then response body path $.form.username should be foo
    And response body path $.form.password should be bar

  Scenario: send json
    And I set body to {"foo":"bar"}
    When I POST to /post
    Then response body path $.json.foo should be bar
