Feature: Assert response code not equal

  Scenario: should assert response code not equal
    When I GET /status/400
    Then response code should not be 200
    And response code should be 400
