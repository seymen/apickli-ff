Feature: Making PUT requests

  Scenario: should send a PUT request to target
    When I PUT /anything
    Then response code should be 200
    And response body path $.method should be PUT
