Feature: Making OPTIONS requests

  Scenario: should send an OPTIONS request to target
    When I request OPTIONS for /anything
    Then response code should be 200
    Then response header Access-Control-Allow-Origin should be *
