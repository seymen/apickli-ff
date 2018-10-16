Feature: Set body to some json feature

  Scenario: send json
    Given I set body to {"foo":"bar"}
    When I POST to /post
    Then response body path $.json.foo should be bar
