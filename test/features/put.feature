Feature: Making PUT requests

  Scenario: should send a PUT request to target
    When I PUT /put
    Then response code should be 200

  Scenario: should send a PUT request to target
    When I PUT /post
    Then response code should be 405